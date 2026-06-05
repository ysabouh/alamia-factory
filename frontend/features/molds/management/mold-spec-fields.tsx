"use client";

import { WfmField, WfmInput, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import type { UseFormRegister, Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { MoldFormValues } from "@/features/molds/management/mold-form-schema";

function SpecSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-card/20 p-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children}
    </div>
  );
}

export function InjectionMoldSpecFields({
  register,
  control
}: {
  register: UseFormRegister<MoldFormValues>;
  control: Control<MoldFormValues>;
}) {
  return (
    <SpecSection title="مواصفات قالب الحقن">
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="injectionSpec.hotRunner"
          render={({ field }) => (
            <WfmField label="Hot Runner">
              <WfmSelect value={field.value ? "1" : "0"} onChange={(e) => field.onChange(e.target.value === "1")}>
                <option value="0">لا</option>
                <option value="1">نعم</option>
              </WfmSelect>
            </WfmField>
          )}
        />
        <WfmField label="نوع الـ Runner">
          <WfmInput {...register("injectionSpec.runnerType")} />
        </WfmField>
        <WfmField label="نوع البوابة">
          <WfmInput {...register("injectionSpec.gateType")} />
        </WfmField>
        <WfmField label="دوائر التبريد">
          <WfmInput type="number" {...register("injectionSpec.coolingCircuitCount")} />
        </WfmField>
        <WfmField label="نظام الإخراج">
          <WfmInput {...register("injectionSpec.ejectorSystemType")} />
        </WfmField>
        <WfmField label="أقصى ضغط حقن (bar)">
          <WfmInput type="number" step="0.01" {...register("injectionSpec.maxInjectionPressure")} />
        </WfmField>
        <WfmField label="قوة الإغلاق المطلوبة (ton)">
          <WfmInput type="number" step="0.01" {...register("injectionSpec.clampForceRequired")} />
        </WfmField>
        <WfmField label="زمن الدورة (ث)">
          <WfmInput type="number" step="0.01" {...register("injectionSpec.cycleTime")} />
        </WfmField>
        <WfmField label="نوع فولاذ القالب">
          <WfmInput {...register("injectionSpec.moldSteelType")} />
        </WfmField>
        <WfmField label="نسبة الانكماش">
          <WfmInput type="number" step="0.0001" {...register("injectionSpec.shrinkageRate")} />
        </WfmField>
        <WfmField label="Core Pulls">
          <WfmInput type="number" {...register("injectionSpec.corePullCount")} />
        </WfmField>
        <WfmField label="نوع التexture">
          <WfmInput {...register("injectionSpec.textureType")} />
        </WfmField>
        <WfmField label="مواد مدعومة (مفصولة بفاصلة)" className="sm:col-span-2">
          <WfmInput {...register("injectionSpec.supportedMaterials")} placeholder="PP, PE, ABS" />
        </WfmField>
      </div>
    </SpecSection>
  );
}

export function PetBlowMoldSpecFields({
  register,
  control
}: {
  register: UseFormRegister<MoldFormValues>;
  control: Control<MoldFormValues>;
}) {
  return (
    <SpecSection title="مواصفات قالب نفخ PET">
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="petBlowSpec.blowType"
          render={({ field }) => (
            <WfmField label="نوع النفخ">
              <WfmSelect {...field} value={field.value ?? ""}>
                <option value="">—</option>
                <option value="extrusion">Extrusion</option>
                <option value="injection">Injection</option>
                <option value="stretch">Stretch</option>
              </WfmSelect>
            </WfmField>
          )}
        />
        <WfmField label="حجم الزجاجة (ml)">
          <WfmInput type="number" {...register("petBlowSpec.bottleVolumeMl")} />
        </WfmField>
        <WfmField label="قطر العنق (mm)">
          <WfmInput type="number" step="0.01" {...register("petBlowSpec.neckDiameter")} />
        </WfmField>
        <WfmField label="طريقة التبريد">
          <WfmInput {...register("petBlowSpec.coolingMethod")} />
        </WfmField>
        <WfmField label="ضغط الهواء (bar)">
          <WfmInput type="number" step="0.01" {...register("petBlowSpec.airPressureRequired")} />
        </WfmField>
        <WfmField label="Blow Ratio">
          <WfmInput type="number" step="0.001" {...register("petBlowSpec.blowRatio")} />
        </WfmField>
        <WfmField label="نوع Parison">
          <WfmInput {...register("petBlowSpec.parisonType")} />
        </WfmField>
        <WfmField label="زمن التبريد (ث)">
          <WfmInput type="number" step="0.01" {...register("petBlowSpec.coolingTime")} />
        </WfmField>
        <WfmField label="مادة القالب">
          <WfmInput {...register("petBlowSpec.moldMaterial")} />
        </WfmField>
        <WfmField label="أقصى حرارة">
          <WfmInput type="number" step="0.01" {...register("petBlowSpec.maxTemperature")} />
        </WfmField>
        <WfmField label="بولimerات مدعومة" className="sm:col-span-2">
          <WfmInput {...register("petBlowSpec.supportedPolymers")} placeholder="PET, rPET" />
        </WfmField>
      </div>
    </SpecSection>
  );
}

export function CompressionMoldSpecFields({
  register
}: {
  register: UseFormRegister<MoldFormValues>;
}) {
  return (
    <SpecSection title="مواصفات قالب الضغط">
      <div className="grid gap-3 sm:grid-cols-2">
        <WfmField label="قوة الضغط">
          <WfmInput type="number" step="0.01" {...register("compressionSpec.compressionForce")} />
        </WfmField>
        <WfmField label="نوع التسخين">
          <WfmInput {...register("compressionSpec.heatingType")} />
        </WfmField>
        <WfmField label="حرارة القالب">
          <WfmInput type="number" step="0.01" {...register("compressionSpec.moldTemperature")} />
        </WfmField>
        <WfmField label="زمن الضغط">
          <WfmInput type="number" step="0.01" {...register("compressionSpec.pressureTime")} />
        </WfmField>
        <WfmField label="زمن المعالجة">
          <WfmInput type="number" step="0.01" {...register("compressionSpec.curingTime")} />
        </WfmField>
        <WfmField label="مادة القالب">
          <WfmInput {...register("compressionSpec.moldMaterial")} />
        </WfmField>
        <WfmField label="مناطق التسخين">
          <WfmInput type="number" {...register("compressionSpec.heatingZones")} />
        </WfmField>
        <WfmField label="أقصى سماكة منتج">
          <WfmInput type="number" step="0.01" {...register("compressionSpec.maxProductThickness")} />
        </WfmField>
        <WfmField label="مواد مدعومة" className="sm:col-span-2">
          <WfmInput {...register("compressionSpec.supportedMaterials")} />
        </WfmField>
      </div>
    </SpecSection>
  );
}

export function PolyethyleneMoldSpecFields({
  register,
  control
}: {
  register: UseFormRegister<MoldFormValues>;
  control: Control<MoldFormValues>;
}) {
  return (
    <SpecSection title="مواصفات قالب Polyethylene (PE)">
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="polyethyleneSpec.polyethyleneType"
          render={({ field }) => (
            <WfmField label="نوع PE *">
              <WfmSelect {...field} value={field.value ?? ""}>
                <option value="">—</option>
                <option value="hdpe">HDPE</option>
                <option value="ldpe">LDPE</option>
                <option value="lldpe">LLDPE</option>
              </WfmSelect>
            </WfmField>
          )}
        />
        <Controller
          control={control}
          name="polyethyleneSpec.productionMethod"
          render={({ field }) => (
            <WfmField label="طريقة الإنتاج *">
              <WfmSelect {...field} value={field.value ?? ""}>
                <option value="">—</option>
                <option value="blow">نفخ PE</option>
                <option value="rotational">دوراني</option>
                <option value="extrusion">بثق</option>
              </WfmSelect>
            </WfmField>
          )}
        />
        <WfmField label="حجم الخزان (L)">
          <WfmInput type="number" step="0.001" {...register("polyethyleneSpec.tankVolume")} />
        </WfmField>
        <WfmField label="سماكة الجدار (mm)">
          <WfmInput type="number" step="0.001" {...register("polyethyleneSpec.wallThickness")} />
        </WfmField>
        <WfmField label="طريقة التبريد">
          <WfmInput {...register("polyethyleneSpec.coolingMethod")} />
        </WfmField>
        <WfmField label="مادة القالب">
          <WfmInput {...register("polyethyleneSpec.moldMaterial")} />
        </WfmField>
        <WfmField label="نظام التسخين">
          <WfmInput {...register("polyethyleneSpec.heatingSystem")} />
        </WfmField>
        <WfmField label="زمن الدورة (ث)">
          <WfmInput type="number" step="0.01" {...register("polyethyleneSpec.cycleTime")} />
        </WfmField>
        <WfmField label="تصنيف الضغط (bar)">
          <WfmInput type="number" step="0.01" {...register("polyethyleneSpec.pressureRating")} />
        </WfmField>
        <WfmField label="أدنى حرارة (°C)">
          <WfmInput type="number" step="0.01" {...register("polyethyleneSpec.minTemperature")} />
        </WfmField>
        <WfmField label="أقصى حرارة (°C)">
          <WfmInput type="number" step="0.01" {...register("polyethyleneSpec.maxTemperature")} />
        </WfmField>
        <WfmField label="طبقات القالب">
          <WfmInput type="number" {...register("polyethyleneSpec.moldLayers")} />
        </WfmField>
        <WfmField label="سرعة الدوران (rpm)">
          <WfmInput type="number" step="0.01" {...register("polyethyleneSpec.rotationalSpeed")} />
        </WfmField>
        <WfmField label="نسبة الانكماش">
          <WfmInput type="number" step="0.0001" {...register("polyethyleneSpec.shrinkageRate")} />
        </WfmField>
        <WfmField label="منتجات مدعومة" className="sm:col-span-2">
          <WfmInput {...register("polyethyleneSpec.supportedProducts")} placeholder="خزانات, أنابيب, …" />
        </WfmField>
      </div>
    </SpecSection>
  );
}
