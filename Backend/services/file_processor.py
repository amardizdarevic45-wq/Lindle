"""File processing utilities for extracting text from various file formats."""

import io
import tempfile
import os
import contextlib
from typing import List
from fastapi import HTTPException


SUPPORTED_EXTS = {"pdf", "docx", "txt"}


@contextlib.contextmanager
def change_working_directory(new_dir):
    """Context manager to safely change and restore working directory."""
    original_dir = os.getcwd()
    try:
        os.chdir(new_dir)
        yield
    finally:
        os.chdir(original_dir)


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file bytes."""

    print("Start Extract text from PDF...")
    
    # Fix for 'static/' directory error - create directories BEFORE importing PyMuPDF
    import os
    original_cwd = os.getcwd()
    print(f"Current working directory: {original_cwd}")
    
    # Set environment variables that PyMuPDF might need
    os.environ['PYMUPDF_TEMP_DIR'] = os.path.join(original_cwd, 'tmp')
    os.environ['PYMUPDF_STATIC_DIR'] = os.path.join(original_cwd, 'static')
    os.environ['TMPDIR'] = os.path.join(original_cwd, 'tmp')
    print(f"Set environment variables for PyMuPDF")
    
    # Create multiple possible static directories that PyMuPDF might need
    static_dirs = [
        os.path.join(original_cwd, 'static'),
        os.path.join(original_cwd, 'tmp'),
        os.path.join(os.path.expanduser('~'), '.pymupdf', 'static'),
        os.path.join(os.path.expanduser('~'), '.cache', 'pymupdf'),
    ]
    
    for static_dir in static_dirs:
        if not os.path.exists(static_dir):
            try:
                os.makedirs(static_dir, exist_ok=True)
                print(f"Created directory: {static_dir}")
            except Exception as dir_error:
                print(f"Warning: Could not create directory {static_dir}: {dir_error}")
    
    try:
        # Test if PyMuPDF can be imported and used at all
        try:
            import fitz  # PyMuPDF
            print(f"PyMuPDF version: {fitz.version}")
            
            # Test basic functionality before proceeding
            test_doc = fitz.open()
            test_page = test_doc.new_page()
            test_text = test_page.get_text("text")
            test_doc.close()
            print("PyMuPDF basic functionality test passed")
            
        except ImportError:
            print("PyMuPDF import failed, will use alternatives")
            fitz = None
        except Exception as test_error:
            print(f"PyMuPDF functionality test failed: {test_error}")
            print("Will use alternative PDF libraries")
            fitz = None
        
        # If PyMuPDF is not working, skip to alternatives immediately
        if fitz is None:
            print("Skipping PyMuPDF, using alternative libraries...")
            text_parts = []
            
            # Try pdfplumber first
            try:
                import pdfplumber
                print("Using pdfplumber...")
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    for page_num, page in enumerate(pdf.pages):
                        text = page.extract_text() or ""
                        text_parts.append(text)
                        print(f"Page {page_num + 1}: {len(text)} characters extracted (pdfplumber)")
                return "\n".join(text_parts).strip()
            except ImportError:
                print("pdfplumber not available")
            except Exception as pdfplumber_error:
                print(f"pdfplumber failed: {pdfplumber_error}")
            
            # Try PyPDF2
            try:
                import PyPDF2
                print("Using PyPDF2...")
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                for page_num, page in enumerate(pdf_reader.pages):
                    text = page.extract_text() or ""
                    text_parts.append(text)
                    print(f"Page {page_num + 1}: {len(text)} characters extracted (PyPDF2)")
                return "\n".join(text_parts).strip()
            except ImportError:
                print("PyPDF2 not available")
            except Exception as pypdf2_error:
                print(f"PyPDF2 failed: {pypdf2_error}")
            
            raise Exception("All PDF libraries failed. Please install at least one: pip install pdfplumber PyPDF2")
        
        text_parts = []
        
        # Method 1: Try stream processing with working directory fix
        try:
            print("Attempting stream-based PDF processing...")
            # Use context manager for safer directory changes
            safe_dir = static_dirs[0]  # Use the first created directory
            with change_working_directory(safe_dir):
                print(f"Changed to working directory: {os.getcwd()}")
                
                with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                    print(f"PDF opened successfully, pages: {len(doc)}")
                    for page_num, page in enumerate(doc):
                        text = page.get_text("text") or ""
                        text_parts.append(text)
                        print(f"Page {page_num + 1}: {len(text)} characters extracted")
            
            return "\n".join(text_parts).strip()
            
        except Exception as fitz_error:
            print(f"Stream processing failed: {fitz_error}")
            print(f"Error type: {type(fitz_error).__name__}")
            
            # Method 2: Try with temporary file
            try:
                print("Attempting temporary file-based PDF processing...")
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                    temp_file.write(file_bytes)
                    temp_file.flush()
                    print(f"Temporary file created: {temp_file.name}")
                    
                    with fitz.open(temp_file.name) as doc:
                        for page_num, page in enumerate(doc):
                            text = page.get_text("text") or ""
                            text_parts.append(text)
                            print(f"Page {page_num + 1}: {len(text)} characters extracted")
                    
                    # Clean up temp file
                    os.unlink(temp_file.name)
                    print("Temporary file cleaned up successfully")
                    return "\n".join(text_parts).strip()
                    
            except Exception as temp_error:
                print(f"Temporary file method failed: {temp_error}")
                print(f"Error type: {type(temp_error).__name__}")
                
                # Method 3: Try alternative text extraction methods
                try:
                    print("Attempting alternative text extraction methods...")
                    with change_working_directory(safe_dir):
                        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                            for page_num, page in enumerate(doc):
                                # Try different text extraction methods
                                text = page.get_text("text")
                                if not text:
                                    text = page.get_text("words")
                                if not text:
                                    text = page.get_text("dict")
                                text_parts.append(str(text) if text else "")
                                print(f"Page {page_num + 1}: {len(str(text))} characters extracted (alternative method)")
                    return "\n".join(text_parts).strip()
                except Exception as fallback_error:
                    print(f"All extraction methods failed")
                    print(f"Fallback error: {fallback_error}")
                    
                    # Method 4: Try alternative PDF libraries
                    try:
                        print("Attempting alternative PDF libraries...")
                        
                        # Try pdfplumber
                        try:
                            import pdfplumber
                            print("Using pdfplumber as fallback...")
                            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                                for page_num, page in enumerate(pdf.pages):
                                    text = page.extract_text() or ""
                                    text_parts.append(text)
                                    print(f"Page {page_num + 1}: {len(text)} characters extracted (pdfplumber)")
                            return "\n".join(text_parts).strip()
                        except ImportError:
                            print("pdfplumber not available")
                        except Exception as pdfplumber_error:
                            print(f"pdfplumber failed: {pdfplumber_error}")
                        
                        # Try PyPDF2
                        try:
                            import PyPDF2
                            print("Using PyPDF2 as fallback...")
                            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
                            for page_num, page in enumerate(pdf_reader.pages):
                                text = page.extract_text() or ""
                                text_parts.append(text)
                                print(f"Page {page_num + 1}: {len(text)} characters extracted (PyPDF2)")
                            return "\n".join(text_parts).strip()
                        except ImportError:
                            print("PyPDF2 not available")
                        except Exception as pypdf2_error:
                            print(f"PyPDF2 failed: {pypdf2_error}")
                        
                        # If all alternatives fail, raise the original error
                        raise Exception(f"All PDF extraction methods failed. PyMuPDF: {fitz_error}, Temp file: {temp_error}, Fallback: {fallback_error}")
                        
                    except Exception as alt_lib_error:
                        print(f"Alternative libraries also failed: {alt_lib_error}")
                        raise Exception(f"PDF text extraction failed. PyMuPDF: {fitz_error}, Temp file: {temp_error}, Fallback: {fallback_error}, Alternatives: {alt_lib_error}")
                
    except Exception as e:
        print(f"PDF processing error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        raise Exception(f"PDF processing error: {str(e)}")
    finally:
        # Ensure we restore the working directory
        try:
            if 'original_cwd' in locals():
                os.chdir(original_cwd)
                print(f"Restored working directory: {os.getcwd()}")
        except Exception as restore_error:
            print(f"Warning: Could not restore working directory: {restore_error}")


def _extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX file bytes."""
    import docx
    f = io.BytesIO(file_bytes)
    document = docx.Document(f)
    return "\n".join(p.text for p in document.paragraphs).strip()


def extract_text_from_file(filename: str, content: bytes) -> str:
    """Extract text from uploaded file based on file extension."""
    ext = (filename.split(".")[-1] or "").lower()
    if ext not in SUPPORTED_EXTS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: .{ext}. Use PDF, DOCX, or TXT."
        )

    print("Extracting text from file..")
    print(ext)
    
    try:
        if ext == "pdf":
            return _extract_text_from_pdf(content)
        if ext == "docx":
            return _extract_text_from_docx(content)
        return content.decode("utf-8", errors="ignore")
    except Exception as e:

        raise HTTPException(
            status_code=400, 
            detail=f"Failed to read {ext.upper()} file: {e}"
        )