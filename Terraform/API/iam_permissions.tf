resource "google_project_iam_binding" "cloudrun_deployer" {
  project = var.project_id
  role    = "roles/run.admin"

  members = [
    "serviceAccount:${var.github_sa_email}"
  ]
}

resource "google_project_iam_binding" "artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"

  members = [
    "serviceAccount:${var.github_sa_email}"
  ]
}