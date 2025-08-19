resource "google_artifact_registry_repository" "yca-ca" {
  provider      = google
  project       = var.project_id
  location      = var.region
  repository_id = var.service_name
  format        = "DOCKER"
}
