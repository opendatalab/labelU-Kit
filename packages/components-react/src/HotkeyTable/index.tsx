import styled from 'styled-components';

export interface TableColumn {
  title: string;
  key: string;
}

export interface HotkeyTableProps {
  columns: TableColumn[];
  // TODO: type
  data: any[];
}

const TableWrapper = styled.table`
  td {
    padding-right: 7.5rem;
    padding-left: 0.75rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  thead td {
    color: #999;
  }
`;

export function HotkeyTable({ columns, data }: HotkeyTableProps) {
  return (
    <TableWrapper>
      <thead>
        <tr>
          {columns.map((column) => {
            return <td key={column.key}>{column.title}</td>;
          })}
        </tr>
      </thead>
      <tbody>
        {data?.map((item: any) => {
          return (
            <tr key={item.action}>
              {columns.map((column) => {
                return <td key={column.key}>{item[column.key]}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </TableWrapper>
  );
}
