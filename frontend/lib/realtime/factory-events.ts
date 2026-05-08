export const factoryChannels = {
  liveDashboard: "private-factory.live-dashboard",
  machine: (machineId: number) => `private-machines.${machineId}`
} as const;

export const factoryEvents = {
  machineStatusUpdated: "MachineStatusUpdated",
  productionEntryCreated: "ProductionEntryCreated",
  wasteEntryCreated: "WasteEntryCreated",
  maintenanceTicketOpened: "MaintenanceTicketOpened",
  inventoryStockChanged: "InventoryStockChanged",
  alertRaised: "AlertRaised"
} as const;
