resource "google_service_account" "github_sa" {
  account_id   = "github-actions-deployer"
  display_name = "GitHub Actions Deployer"
}

resource "google_service_account_key" "github_sa_key" {
  service_account_id = google_service_account.github_sa.name
}
