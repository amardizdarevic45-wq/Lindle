"""Contract analysis routes."""

import io
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime
import re

from models.analysis import AnalysisResponse
from services.file_processor import extract_text_from_file
from services.openai_service import analyze_contract
from services.pdf_service import generate_analysis_pdf
from services.firebase_service import db
from services.gcs_service import gcs_service

router = APIRouter()


def extract_clauses_from_text(text: str) -> List[str]:
    """
    Extract clauses from contract text using pattern matching.
    This is a basic implementation - you can enhance it based on your needs.
    """
    clauses = []
    
    # Split text into potential clauses based on common patterns
    # Look for numbered sections, bullet points, or paragraph breaks
    
    # Pattern 1: Numbered sections (e.g., "1.", "1.1", "Section 1")
    numbered_pattern = r'(?:^|\n)(?:\d+\.?\d*\.?\s*)([^\n]+(?:\n(?!\d+\.?\d*\.?\s*)[^\n]*)*)'
    numbered_matches = re.findall(numbered_pattern, text, re.MULTILINE)
    clauses.extend([match.strip() for match in numbered_matches if len(match.strip()) > 20])
    
    # Pattern 2: Section headers (e.g., "Section", "Article", "Clause")
    section_pattern = r'(?:^|\n)(?:Section|Article|Clause|Part)\s+\d+[^\n]*\n([^\n]+(?:\n(?!Section|Article|Clause|Part)[^\n]*)*)'
    section_matches = re.findall(section_pattern, text, re.MULTILINE | re.IGNORECASE)
    clauses.extend([match.strip() for match in section_matches if len(match.strip()) > 20])
    
    # Pattern 3: Bullet points or dashes
    bullet_pattern = r'(?:^|\n)(?:[-•*]\s*)([^\n]+(?:\n(?![-•*]\s*)[^\n]*)*)'
    bullet_matches = re.findall(bullet_pattern, text, re.MULTILINE)
    clauses.extend([match.strip() for match in bullet_matches if len(match.strip()) > 20])
    
    # Pattern 4: Paragraphs (fallback for unstructured text)
    if not clauses:
        paragraphs = text.split('\n\n')
        clauses = [p.strip() for p in paragraphs if len(p.strip()) > 50]
    
    # Clean and filter clauses
    cleaned_clauses = []
    for clause in clauses:
        clause = clause.strip()
        if len(clause) > 20 and not clause.startswith('Page') and not clause.isdigit():
            cleaned_clauses.append(clause)
    
    return cleaned_clauses[:20]  # Limit to 20 clauses to avoid overwhelming the database


@router.get("/health")
async def health_check():
    """Health check endpoint to verify Firebase and GCS connectivity."""
    health_status = {
        "status": "healthy",
        "firebase": "unknown",
        "gcs": "unknown",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Check Firebase
    if db:
        try:
            # Try to access a collection to test connectivity
            test_ref = db.collection('_health_check')
            health_status["firebase"] = "connected"
            print("✅ Firebase health check: Connected")
        except Exception as e:
            health_status["firebase"] = f"error: {str(e)}"
            print(f"❌ Firebase health check: Error - {e}")
    else:
        health_status["firebase"] = "not_initialized"
        print("❌ Firebase health check: Not initialized")
    
    # Check GCS
    if gcs_service and gcs_service.client:
        try:
            # Try to list buckets to test connectivity
            buckets = list(gcs_service.client.list_buckets())
            health_status["gcs"] = "connected"
            print("✅ GCS health check: Connected")
        except Exception as e:
            health_status["gcs"] = f"error: {str(e)}"
            print(f"❌ GCS health check: Error - {e}")
    else:
        health_status["gcs"] = "not_initialized"
        print("❌ GCS health check: Not initialized")
    
    return health_status


@router.post("/analyze")
async def analyze_contract_endpoint(
    file: UploadFile = File(...),
    role: str = Form("freelancer"),
    risk_tolerance: str = Form("standard"),
):
    """Analyze contract and return results."""
    # Read file content once for text extraction
    content = await file.read()
    text = extract_text_from_file(file.filename, content)
    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Contract appears empty or too short.")

    result = analyze_contract(text, role=role, risk=risk_tolerance)
    
    # Upload file to Google Cloud Storage even for non-authenticated users
    gcs_file_path = None
    print(gcs_service)
    if gcs_service:
        # Create a new UploadFile-like object with the content we already read
        from fastapi import UploadFile
        import io
        
        # Create a new file-like object with the content
        file_content = io.BytesIO(content)
        file_content.seek(0)
        
        print(f"Uploading to GCS - Filename: {file.filename}")
        print(f"Uploading to GCS - Content Type: {file.content_type}")
        print(f"Uploading to GCS - File Size: {len(content)} bytes")
        
        gcs_file_path = gcs_service.upload_file(
            file_content=content,  # Pass the bytes directly
            file_name=file.filename,
            content_type=file.content_type
        )
        print(f"File uploaded to GCS for non-authenticated user: {gcs_file_path}")
    
    # Add GCS information to the result
    result_dict = result.dict()
    result_dict['gcs_file_path'] = gcs_file_path
    result_dict['gcs_file_url'] = gcs_service.get_file_url(gcs_file_path) if gcs_file_path else None
    
    # Add extracted text and clauses to the response
    result_dict['extracted_text'] = text
    result_dict['extracted_clauses'] = extract_clauses_from_text(text)
    
    return result_dict


@router.post("/analyze_pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
    role: str = Form("freelancer"),
    risk_tolerance: str = Form("standard"),
):
    """Analyze contract and return downloadable PDF report."""
    content = await file.read()
    text = extract_text_from_file(file.filename, content)
    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Contract appears empty or too short.")

    result = analyze_contract(text, role=role, risk=risk_tolerance)
    pdf_bytes = generate_analysis_pdf(result.summary, result.red_flags, result.pushbacks)
    headers = {"Content-Disposition": "attachment; filename=contract_analysis.pdf"}
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)


@router.post("/analyze_with_user")
async def analyze_with_user(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    role: str = Form("freelancer"),
    risk_tolerance: str = Form("standard"),
):
    """Analyze contract and save to Firebase for the specified user."""
    print(f"=== /analyze_with_user endpoint called ===")
    print(f"User ID: {user_id}")
    print(f"Role: {role}")
    print(f"Risk Tolerance: {risk_tolerance}")
    print(f"Filename: {file.filename}")
    
    # Check Firebase availability immediately
    print(f"Firebase db object: {db}")
    print(f"Firebase db type: {type(db)}")
    if db:
        print(f"Firebase db path: {db._path if hasattr(db, '_path') else 'No _path attribute'}")
    
    try:
        content = await file.read()
        print(f"File content read successfully, size: {len(content)} bytes")
        
        text = extract_text_from_file(file.filename, content)
        print(f"Text extraction completed, length: {len(text)} characters")
        
        if not text or len(text) < 50:
            print("Text too short, raising error")
            raise HTTPException(status_code=400, detail="Contract appears empty or too short.")

        print("Starting contract analysis...")
        result = analyze_contract(text, role=role, risk=risk_tolerance)
        print(f"Contract analysis completed successfully")
        print(f"Summary length: {len(result.summary)}")
        print(f"Red flags count: {len(result.red_flags)}")
        print(f"Pushbacks count: {len(result.pushbacks)}")
        
        # Save contract to Firebase
        print(f"Checking Firebase availability...")
        if db:
            print(f"Firebase is available, proceeding with save...")
            try:
                # Upload file to Google Cloud Storage
                gcs_file_path = None
                if gcs_service:
                    print(f"GCS service is available, uploading file...")
                    print(f"Uploading to GCS - Filename: {file.filename}")
                    print(f"Uploading to GCS - Content Type: {file.content_type}")
                    print(f"Uploading to GCS - File Size: {len(content)} bytes")
                    
                    gcs_file_path = gcs_service.upload_file(
                        file_content=content,  # Pass the bytes directly
                        file_name=file.filename,
                        content_type=file.content_type
                    )
                    print(f"GCS upload result: {gcs_file_path}")
                else:
                    print("GCS service not available, skipping file upload")
                
                # Prepare contract data
                contract_data = {
                    'userId': user_id,
                    'fileName': file.filename,
                    'gcsFilePath': gcs_file_path,  # Add GCS file path
                    'gcsFileUrl': gcs_service.get_file_url(gcs_file_path) if gcs_file_path else None,  # Add GCS file URL
                    'summary': result.summary,
                    'redFlags': result.red_flags,
                    'pushbacks': result.pushbacks,
                    'role': role,
                    'riskTolerance': risk_tolerance,
                    'status': 'draft',
                    'createdAt': datetime.utcnow().isoformat(),
                    'updatedAt': datetime.utcnow().isoformat(),
                    'extractedText': text,  # Add extracted text
                    'extractedClauses': extract_clauses_from_text(text)  # Add extracted clauses
                }
                
                print(f"Contract data prepared: {contract_data}")
                print(f"Attempting to save to Firebase collection 'contracts'...")
                
                contracts_ref = db.collection('contracts')
                print(f"Firebase collection reference created: {contracts_ref}")
                
                doc_ref = contracts_ref.add(contract_data)
                print(f"Firebase document added successfully!")
                print(f"Document ID: {doc_ref[1].id}")
                print(f"Document reference: {doc_ref[0]}")
                
                # Add the document ID to the response
                result_dict = result.dict()
                result_dict['contract_id'] = doc_ref[1].id
                result_dict['gcs_file_path'] = gcs_file_path
                result_dict['gcs_file_url'] = gcs_service.get_file_url(gcs_file_path) if gcs_file_path else None
                
                # Add extracted text and clauses to the response
                result_dict['extracted_text'] = text
                result_dict['extracted_clauses'] = extract_clauses_from_text(text)
                
                print(f"=== /analyze_with_user completed successfully ===")
                print(f"Returning result with contract_id: {result_dict['contract_id']}")
                return result_dict
                
            except Exception as e:
                print(f"ERROR in Firebase save operation: {e}")
                print(f"Error type: {type(e).__name__}")
                import traceback
                print(f"Full traceback: {traceback.format_exc()}")
                # Return the analysis result even if saving fails
                print(f"Returning analysis result without Firebase save")
                result_dict = result.dict()
                result_dict['extracted_text'] = text
                result_dict['extracted_clauses'] = extract_clauses_from_text(text)
                return result_dict
        else:
            print(f"Firebase is NOT available (db is None)")
            print(f"Returning analysis result without Firebase save")
            # Return the analysis result if Firebase is not available
            result_dict = result.dict()
            result_dict['extracted_text'] = text
            result_dict['extracted_clauses'] = extract_clauses_from_text(text)
            return result_dict
            
    except Exception as e:
        print(f"ERROR in /analyze_with_user endpoint: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")