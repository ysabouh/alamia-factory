export const WORKFLOW_CATEGORY_LABELS: Record<string, string> = {
  production: "الإنتاج",
  maintenance: "الصيانة",
  quality: "الجودة",
  purchasing: "المشتريات",
  warehouse: "المستودعات",
  hr: "الموارد البشرية",
  administration: "الإدارة",
  custom: "مخصص"
};

export const WORKFLOW_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  pending: "قيد الانتظار",
  assigned: "معيّن",
  accepted: "مقبول",
  in_progress: "قيد التنفيذ",
  waiting_approval: "بانتظار الموافقة",
  waiting_information: "بانتظار معلومات",
  rejected: "مرفوض",
  completed: "مكتمل",
  cancelled: "ملغى",
  overdue: "متأخر"
};

export const WORKFLOW_PRIORITY_LABELS: Record<string, string> = {
  low: "منخفض",
  normal: "عادي",
  high: "مرتفع",
  urgent: "عاجل"
};

export const ASSIGNMENT_TYPE_LABELS: Record<string, string> = {
  single_employee: "موظف واحد",
  multiple_any: "عدة موظفين (أي واحد)",
  multiple_all: "عدة موظفين (الكل)",
  sequential: "تسلسلي",
  department: "قسم",
  role: "دور وظيفي"
};

export const WORKFLOW_TIMELINE_LABELS: Record<string, string> = {
  created: "بدء سير العمل",
  assigned: "تعيين مهمة",
  accepted: "قبول المهمة",
  started: "بدء التنفيذ",
  updated: "تحديث",
  returned: "إرجاع لمرحلة سابقة",
  approved: "موافقة",
  rejected: "رفض",
  completed: "اكتمال سير العمل",
  cancelled: "إلغاء",
  clarification_requested: "طلب توضيح",
  stage_advanced: "انتقال لمرحلة جديدة",
  overdue: "تأخر"
};

export const WORKFLOW_COMMENT_TYPE_LABELS: Record<string, string> = {
  comment: "تعليق",
  rejection: "سبب الرفض",
  clarification: "طلب توضيح"
};

export const WORKFLOW_STAGE_STATE_LABELS: Record<string, string> = {
  completed: "مكتملة",
  current: "جارية",
  pending: "قادمة"
};
