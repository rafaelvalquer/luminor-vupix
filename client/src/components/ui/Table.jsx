export default function Table({ columns, data, empty, renderRow }) {
  if (!data?.length) {
    return empty || null;
  }

  return (
    <div className="table-shell">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{data.map(renderRow)}</tbody>
      </table>
    </div>
  );
}
