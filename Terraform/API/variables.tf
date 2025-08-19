# variables.tf

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "europe-central2"
}

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
}

variable "image_tag" {
  description = "The tag for the image to be deployed (e.g., GitHub commit hash)"
  type        = string
}

variable "github_sa_email" {
  description = "The email of the GitHub Actions Service Account"
  type        = string
}

variable "gar_location" {
  description = "The location of the Artifact Registry"
  type        = string
  default     = "europe-central2"
}

variable "cloud_run_service_name_testing" {
  description = "The name of the Cloud Run service for testing"
  type        = string
}
