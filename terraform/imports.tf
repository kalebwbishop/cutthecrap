# One-time imports to adopt existing Azure resources into remote state.
# These blocks are idempotent — Terraform skips them once the resource
# is already in state. Safe to remove after the first successful apply.

import {
  to = azurerm_virtual_network.this
  id = "/subscriptions/3d5d1ab2-b17f-4c99-9bf1-db4fe0ad882e/resourceGroups/res000_0_4e69310cb4464d46/providers/Microsoft.Network/virtualNetworks/vnet-cutthecrap"
}

import {
  to = azurerm_subnet.this
  id = "/subscriptions/3d5d1ab2-b17f-4c99-9bf1-db4fe0ad882e/resourceGroups/res000_0_4e69310cb4464d46/providers/Microsoft.Network/virtualNetworks/vnet-cutthecrap/subnets/snet-cutthecrap"
}

import {
  to = azurerm_network_security_group.this
  id = "/subscriptions/3d5d1ab2-b17f-4c99-9bf1-db4fe0ad882e/resourceGroups/res000_0_4e69310cb4464d46/providers/Microsoft.Network/networkSecurityGroups/nsg-cutthecrap"
}

import {
  to = azurerm_public_ip.this
  id = "/subscriptions/3d5d1ab2-b17f-4c99-9bf1-db4fe0ad882e/resourceGroups/res000_0_4e69310cb4464d46/providers/Microsoft.Network/publicIPAddresses/pip-cutthecrap"
}

import {
  to = azurerm_network_interface.this
  id = "/subscriptions/3d5d1ab2-b17f-4c99-9bf1-db4fe0ad882e/resourceGroups/res000_0_4e69310cb4464d46/providers/Microsoft.Network/networkInterfaces/nic-cutthecrap"
}

import {
  to = azurerm_network_interface_security_group_association.this
  id = "/subscriptions/3d5d1ab2-b17f-4c99-9bf1-db4fe0ad882e/resourceGroups/res000_0_4e69310cb4464d46/providers/Microsoft.Network/networkInterfaces/nic-cutthecrap|/subscriptions/3d5d1ab2-b17f-4c99-9bf1-db4fe0ad882e/resourceGroups/res000_0_4e69310cb4464d46/providers/Microsoft.Network/networkSecurityGroups/nsg-cutthecrap"
}

import {
  to = azurerm_linux_virtual_machine.this
  id = "/subscriptions/3d5d1ab2-b17f-4c99-9bf1-db4fe0ad882e/resourceGroups/res000_0_4e69310cb4464d46/providers/Microsoft.Compute/virtualMachines/vm-cutthecrap"
}
