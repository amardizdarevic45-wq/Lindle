resource "google_cloud_run_service" "lindle" {
  provider = google
  name     = var.service_name
  location = var.region
  project  = var.project_id

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.service_name}/${var.image_tag}"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# resource "google_cloud_run_service" "lindle-test" {
#   provider = google
#   name     = var.cloud_run_service_name_testing
#   location = var.region
#   project  = var.project_id

#   template {
#     spec {
#       containers {
#         image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.cloud_run_service_name_testing}/${var.image_tag}"
#       }
#     }
#   }

#   traffic {
#     percent         = 100
#     latest_revision = true
#   }
# }