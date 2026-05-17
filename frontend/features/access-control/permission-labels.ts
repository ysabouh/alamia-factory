/** تسميات عربية لصلاحيات Spatie */
export const PERMISSION_LABELS: Record<string, string> = {
  "machines.view": "عرض الماكينات",
  "machines.update_status": "تحديث حالة الماكينة",
  "production.record": "تسجيل الإنتاج",
  "production.approve": "اعتماد الإنتاج",
  "production.reports": "تقارير الإنتاج",
  "maintenance.open_ticket": "فتح تذكرة صيانة",
  "maintenance.close_ticket": "إغلاق تذكرة صيانة",
  "inventory.view": "عرض المخزون",
  "inventory.adjust": "تعديل المخزون",
  "inventory.issue_material": "صرف مواد",
  "orders.create": "إنشاء أوامر",
  "orders.update_status": "تحديث حالة الأوامر",
  "analytics.view": "لوحة التحليلات",
  "users.manage": "إدارة المستخدمين والصلاحيات",
  "workforce.view": "عرض القوى العاملة",
  "workforce.manage_placement": "نقل الوردية/القسم",
  "workforce.manage_employees": "إدارة سجل الموظفين (إضافة/تعديل/حذف)"
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام (كامل الصلاحيات)",
  supervisor: "مشرف تشغيل"
};

export function permissionLabel(key: string): string {
  return PERMISSION_LABELS[key] ?? key;
}

export function roleLabel(key: string): string {
  return ROLE_LABELS[key] ?? key;
}
