/** تسميات عربية لصلاحيات Spatie */
export const PERMISSION_LABELS: Record<string, string> = {
  "machines.view": "عرض الماكينات",
  "machines.manage": "إدارة الماكينات",
  "molds.view": "عرض القوالب",
  "molds.manage": "إدارة القوالب",
  "molds.manage_maintenance": "صيانة القوالب",
  "products.view": "عرض المنتجات",
  "products.manage": "إدارة المنتجات",
  "assembly.view": "عرض التجميع",
  "assembly.manage": "إدارة التجميع",
  "machines.update_status": "تحديث حالة الماكينة",
  "production.record": "تسجيل الإنتاج",
  "production.manage": "إدارة أوامر الإنتاج",
  "production.execute": "تنفيذ أوامر الإنتاج (المشرف)",
  "production.approve": "اعتماد الإنتاج",
  "production.reports": "تقارير الإنتاج",
  "quality.inspect": "فحص الجودة",
  "quality.manage_checklists": "إدارة قوالب الفحص",
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
  "workforce.manage_employees": "إدارة سجل الموظفين (إضافة/تعديل/حذف)",
  "workforce.manage_masters": "إدارة المرجعيات (قاعات، أقسام، ورديات)",
  "attendance.view": "عرض الحضور والتقارير",
  "attendance.record": "تسجيل حضور/انصراف",
  "attendance.manage": "إدخال حضور يدوي",
  "attendance.approve": "اعتماد سجلات الحضور",
  "overtime.request": "طلب عمل إضافي",
  "overtime.approve": "اعتماد/رفض الإضافي",
  "overtime.delete": "حذف طلبات الإضافي (مدير)",
  "payroll.view": "عرض ومعاينة الرواتب",
  "payroll.generate": "توليد مسير الرواتب",
  "shifts.assign": "تعيين ورديات للموظفين"
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام (كامل الصلاحيات)",
  supervisor: "مشرف تشغيل",
  hr_manager: "مدير موارد بشرية",
  employee: "موظف (حضور ذاتي)"
};

export function permissionLabel(key: string): string {
  return PERMISSION_LABELS[key] ?? key;
}

export function roleLabel(key: string): string {
  return ROLE_LABELS[key] ?? key;
}
