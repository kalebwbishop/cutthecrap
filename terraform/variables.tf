variable "resource_group_name" {
  description = "Name of the existing Azure resource group"
  type        = string
  default     = "res000_0_4e69310cb4464d46"
}

variable "domain_name" {
  description = "Domain name for the application (e.g. cutthecrap.dev.deploy-box.com)"
  type        = string
  default     = "cutthecrap.deploy-box.com"
}

variable "vm_size" {
  description = "Azure VM size"
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "SSH admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key file for VM authentication"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
