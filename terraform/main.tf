terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "deploy-box-rg-dev"
    storage_account_name = "tfstatedeployboxsadev"
    container_name       = "tfstate"
    key                  = "cutthecrap.tfstate"
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_resource_group" "this" {
  name = var.resource_group_name
}
