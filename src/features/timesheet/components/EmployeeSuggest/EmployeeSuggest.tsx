"use client";

import { FormGroup, MenuItem } from "@blueprintjs/core";
import { type ItemPredicate, type ItemRenderer, Suggest } from "@blueprintjs/select";
import { IconSearch } from "@tabler/icons-react";
import { useId } from "react";
import { icon } from "@/components/shared/icons/AppIcon";
import type { Employee } from "@/features/employees/domain/employee";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Busca por nome, matrícula ou cargo, sem diferenciar acentos. */
const filterEmployee: ItemPredicate<Employee> = (query, employee) => {
  const needle = normalize(query);
  return [employee.name, employee.registration ?? "", employee.jobTitle ?? ""].some((field) =>
    normalize(field).includes(needle),
  );
};

const renderEmployee: ItemRenderer<Employee> = (
  employee,
  { handleClick, handleFocus, modifiers },
) => {
  if (!modifiers.matchesPredicate) return null;
  return (
    <MenuItem
      key={employee.id}
      active={modifiers.active}
      disabled={modifiers.disabled}
      text={employee.name}
      label={employee.registration ?? employee.jobTitle ?? undefined}
      onClick={handleClick}
      onFocus={handleFocus}
      roleStructure="listoption"
    />
  );
};

interface EmployeeSuggestProps {
  readonly employees: readonly Employee[];
  readonly selected: Employee | null;
  readonly onSelect: (employee: Employee) => void;
}

/** Combobox oficial do Blueprint (Suggest) para escolher o colaborador. */
export function EmployeeSuggest({ employees, selected, onSelect }: EmployeeSuggestProps) {
  const inputId = useId();
  return (
    <FormGroup label="Colaborador" labelFor={inputId}>
      <Suggest<Employee>
        items={employees as Employee[]}
        selectedItem={selected}
        itemPredicate={filterEmployee}
        itemRenderer={renderEmployee}
        inputValueRenderer={(employee) => employee.name}
        onItemSelect={onSelect}
        itemsEqual="id"
        noResults={
          <MenuItem disabled text="Nenhum colaborador encontrado." roleStructure="listoption" />
        }
        resetOnClose
        inputProps={{
          id: inputId,
          placeholder: "Buscar por nome ou matrícula…",
          leftIcon: icon(IconSearch),
          size: "large",
        }}
        popoverProps={{ matchTargetWidth: true, minimal: true }}
        fill
      />
    </FormGroup>
  );
}
