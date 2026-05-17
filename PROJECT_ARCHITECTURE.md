# قاعدة بيانات نظام الموظفين — المرحلة الأولى

## الهدف

إنشاء الأساس الاحترافي لنظام إدارة الموظفين داخل نظام المصنع الذكي، بحيث يكون قابلاً للتوسع لاحقاً لربطه مع:

* الحضور والانصراف
* الرواتب
* الورديات
* الصيانة
* أوامر الإنتاج
* التحفيز والعقوبات
* الإجازات
* المحاسبة
* مراقبة الماكينات

---

# الهيكل المعماري المقترح

```text
Company
 └── Factory
      └── Hall
           └── Department
                └── Employees
```

---

# الجداول الأساسية (المرحلة الأولى)

## 1. employees

الجدول الرئيسي للموظفين.

## 2. departments

الأقسام.

## 3. halls

صالات المصنع.

## 4. job_roles

المناصب الوظيفية.

## 5. shifts

الورديات.

## 6. employee_statuses

حالات الموظف.

---

# 1. جدول الصالات

```sql
CREATE TABLE halls (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    hall_type VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 2. جدول الأقسام

```sql
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    hall_id BIGINT REFERENCES halls(id),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 3. جدول المناصب الوظيفية

```sql
CREATE TABLE job_roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    role_level INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 4. جدول الورديات

```sql
CREATE TABLE shifts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 5. جدول حالات الموظف

```sql
CREATE TABLE employee_statuses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL
);
```

---

# 6. جدول الموظفين الرئيسي

```sql
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,

    employee_number VARCHAR(50) UNIQUE NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (
        first_name || ' ' || last_name
    ) STORED,

    gender VARCHAR(20),
    birth_date DATE,

    phone VARCHAR(50),
    emergency_phone VARCHAR(50),
    email VARCHAR(150),

    national_id VARCHAR(100),

    address TEXT,

    hire_date DATE NOT NULL,

    hall_id BIGINT REFERENCES halls(id),
    department_id BIGINT REFERENCES departments(id),
    role_id BIGINT REFERENCES job_roles(id),
    shift_id BIGINT REFERENCES shifts(id),
    status_id BIGINT REFERENCES employee_statuses(id),

    basic_salary NUMERIC(14,2) DEFAULT 0,

    overtime_hour_rate NUMERIC(10,2) DEFAULT 0,

    performance_score NUMERIC(5,2) DEFAULT 0,
    reliability_score NUMERIC(5,2) DEFAULT 0,
    safety_score NUMERIC(5,2) DEFAULT 0,

    annual_leave_balance INTEGER DEFAULT 0,

    profile_image TEXT,

    notes TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# إدراج بيانات أولية حقيقية

## الصالات

```sql
INSERT INTO halls (name, code, hall_type)
VALUES
('Injection Hall 1', 'INJ-H1', 'Injection'),
('Injection Hall 2', 'INJ-H2', 'Injection'),
('Blow Molding Hall', 'BLOW-H1', 'Blow Molding'),
('Packaging Hall', 'PACK-H1', 'Packaging'),
('Maintenance Hall', 'MAIN-H1', 'Maintenance');
```

---

## الأقسام

```sql
INSERT INTO departments (hall_id, name, code)
VALUES
(1, 'Injection Operations', 'DEPT-INJ-OPS'),
(2, 'Injection Operations 2', 'DEPT-INJ2-OPS'),
(3, 'Blow Operations', 'DEPT-BLOW-OPS'),
(4, 'Packaging Operations', 'DEPT-PACK'),
(5, 'Maintenance Department', 'DEPT-MAINT'),
(5, 'Electrical Maintenance', 'DEPT-ELEC'),
(5, 'Mechanical Maintenance', 'DEPT-MECH'),
(4, 'Warehouse Department', 'DEPT-WH');
```

---

## المناصب

```sql
INSERT INTO job_roles (name, code, role_level)
VALUES
('Factory Manager', 'ROLE-FACTORY-MANAGER', 10),
('Production Supervisor', 'ROLE-PROD-SUP', 8),
('Machine Operator', 'ROLE-MACHINE-OP', 5),
('Maintenance Technician', 'ROLE-MAINT-TECH', 5),
('Warehouse Officer', 'ROLE-WH', 4),
('Quality Inspector', 'ROLE-QA', 5),
('HR Officer', 'ROLE-HR', 6),
('Accountant', 'ROLE-ACC', 6);
```

---

## الورديات

```sql
INSERT INTO shifts (name, code, start_time, end_time)
VALUES
('Morning Shift', 'SHIFT-MORNING', '08:00', '16:00'),
('Evening Shift', 'SHIFT-EVENING', '16:00', '00:00'),
('Night Shift', 'SHIFT-NIGHT', '00:00', '08:00');
```

---

## حالات الموظفين

```sql
INSERT INTO employee_statuses (name, code)
VALUES
('Active', 'ACTIVE'),
('On Leave', 'ON_LEAVE'),
('Suspended', 'SUSPENDED'),
('Terminated', 'TERMINATED');
```

---

# إدخال موظفين حقيقيين كنموذج أولي

```sql
INSERT INTO employees (
    employee_number,
    first_name,
    last_name,
    gender,
    birth_date,
    phone,
    email,
    hire_date,
    hall_id,
    department_id,
    role_id,
    shift_id,
    status_id,
    basic_salary,
    overtime_hour_rate,
    performance_score,
    reliability_score,
    safety_score,
    annual_leave_balance
)
VALUES
(
    'EMP-0001',
    'Ahmad',
    'Darwish',
    'Male',
    '1992-05-12',
    '+963944000001',
    'ahmad.darwish@factory.local',
    '2022-01-15',
    1,
    1,
    2,
    1,
    1,
    1200,
    5,
    92,
    95,
    97,
    18
),
(
    'EMP-0002',
    'Omar',
    'Hassan',
    'Male',
    '1996-08-20',
    '+963944000002',
    'omar.hassan@factory.local',
    '2023-03-11',
    1,
    1,
    3,
    1,
    1,
    800,
    3,
    88,
    90,
    93,
    14
),
(
    'EMP-0003',
    'Khaled',
    'Saleh',
    'Male',
    '1989-11-01',
    '+963944000003',
    'khaled.saleh@factory.local',
    '2021-06-05',
    5,
    7,
    4,
    2,
    1,
    1000,
    4,
    91,
    89,
    96,
    20
);
```

---

# الإجرائيات الأساسية (Stored Procedures)

## 1. إنشاء موظف جديد

```sql
CREATE OR REPLACE PROCEDURE create_employee(
    p_employee_number VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_role_id BIGINT,
    p_department_id BIGINT,
    p_shift_id BIGINT,
    p_salary NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO employees (
        employee_number,
        first_name,
        last_name,
        role_id,
        department_id,
        shift_id,
        basic_salary,
        hire_date,
        status_id
    )
    VALUES (
        p_employee_number,
        p_first_name,
        p_last_name,
        p_role_id,
        p_department_id,
        p_shift_id,
        p_salary,
        CURRENT_DATE,
        1
    );
END;
$$;
```

---

## 2. نقل موظف إلى قسم آخر

```sql
CREATE OR REPLACE PROCEDURE transfer_employee_department(
    p_employee_id BIGINT,
    p_department_id BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE employees
    SET department_id = p_department_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_employee_id;
END;
$$;
```

---

## 3. تغيير الوردية

```sql
CREATE OR REPLACE PROCEDURE change_employee_shift(
    p_employee_id BIGINT,
    p_shift_id BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE employees
    SET shift_id = p_shift_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_employee_id;
END;
$$;
```

---

## 4. منح مكافأة أداء

```sql
CREATE OR REPLACE PROCEDURE reward_employee(
    p_employee_id BIGINT,
    p_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE employees
    SET performance_score = performance_score + p_score,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_employee_id;
END;
$$;
```

---

# الفهارس المهمة لتحسين الأداء

```sql
CREATE INDEX idx_employees_department
ON employees(department_id);

CREATE INDEX idx_employees_shift
ON employees(shift_id);

CREATE INDEX idx_employees_role
ON employees(role_id);

CREATE INDEX idx_employees_status
ON employees(status_id);
```

---

# MASTER CURSOR PROMPT — SMART FACTORY ERP/MES PLATFORM

```text
You are a senior industrial software architect and full-stack engineer.

Your mission is to build a world-class Smart Plastic Factory ERP/MES platform.

The platform must combine:
- ERP
- MES
- SCADA-inspired monitoring
- Workforce management
- Industrial inventory
- Fleet management
- Maintenance systems
- Financial operations
- Smart analytics
- Live factory monitoring

==================================================
TECH STACK
==================================================

Backend:
- MySQL
- PHP (Laravel)
- Eloquent ORM
- REST API (Sanctum) + WebSocket حيث ينطبق

Frontend:
- React
- Next.js
- TailwindCSS
- Framer Motion
- Recharts
- SVG visualizations

==================================================
DATABASE ARCHITECTURE
==================================================

Build production-grade MySQL database architecture.

Requirements:
- Normalize correctly
- Add indexes
- Add foreign keys
- Add audit fields
- Add timestamps
- Use BIGINT AUTO_INCREMENT ids
- Add soft delete capability where needed
- Support scalability
- Support real-time monitoring

==================================================
INITIAL MODULES
==================================================

1. Workforce & HR
2. Attendance & Shifts
3. Payroll
4. Leave Management
5. Rewards & Penalties
6. Accounting
7. Inventory
8. Production Orders
9. Machine Management
10. Maintenance
11. Fleet Management
12. Factory Monitoring
13. Analytics & Intelligence

==================================================
DESIGN PHILOSOPHY
==================================================

IMPORTANT:
Avoid traditional ERP feeling completely.

The platform should feel like:
- Tesla Gigafactory software
- Siemens industrial systems
- Modern MES platform
- Industrial command center
- Smart factory digital twin

==================================================
UI/UX REQUIREMENTS
==================================================

- Dark futuristic industrial UI
- Arabic RTL support
- Live operational feel
- Animated monitoring
- Heatmaps
- Smart KPI cards
- Interactive SVG factory maps
- Responsive design
- Role-based dashboards

==================================================
CODING RULES
==================================================

- Write clean scalable code
- Use modular architecture
- Use reusable components
- Use TypeScript everywhere
- Add comments and documentation
- Follow enterprise best practices
- Use service/repository architecture
- Optimize database performance

==================================================
DATABASE FOUNDATION
==================================================

Use the following database structure as the initial foundation.

Continue expanding the system professionally.

---

