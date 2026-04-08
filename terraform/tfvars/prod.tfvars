# Non-secret variables for the prod environment.
# Secrets are passed via -var flags from GitHub Actions secrets.

resource_group_name = "res000_0_4e69310cb4464d46"
domain_name         = "cutthecrap.deploy-box.com"
vm_size             = "Standard_B2s"
