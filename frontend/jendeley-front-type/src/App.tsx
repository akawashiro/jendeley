import React from 'react';
import ReactDOM from 'react-dom/client'
import base_64 from 'base-64'
import './App.css';
import {Entry, DB} from './schema';
// import path_lib from 'path'

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'


const columnHelper = createColumnHelper<Entry>()

// https://tanstack.com/table/v8/docs/examples/react/basic
const columns = [
    columnHelper.accessor('id', {
        header: 'id',
        footer: info => info.column.id,
    }),
    columnHelper.accessor('title', {
        header: 'title',
        cell: props => (
            <a href={`${"http://localhost:5000/api/get_pdf/?file=" + base_64.encode(escape(props.row.original.path))}`}>{`${props.getValue()}`}</a>
        ),
        footer: info => info.column.id,
    }),
    columnHelper.accessor('path', {
        header: 'filename',
        cell: props => (
            <a href={`${"http://localhost:5000/api/get_pdf/?file=" + base_64.encode(escape(props.row.original.path))}`}>{`${props.getValue()}`}</a>
        ),
        footer: info => info.column.id,
    }),
    columnHelper.accessor('authors', {
        header: 'authors',
        footer: info => info.column.id,
    }),
    columnHelper.accessor('year', {
        header: 'year',
        footer: info => info.column.id,
    }),
    columnHelper.accessor('publisher', {
        header: 'publisher',
        footer: info => info.column.id,
    }),

]

function App() {
    const [data, setData] = React.useState<DB>([])

    React.useEffect(() => {
        console.log("Fetching from DB");
        fetch("http://localhost:5000/api/get_db")
            .then(response => response.json())
            .then(json => setData(() => json));
    }, []);


    const [columnVisibility, setColumnVisibility] = React.useState({})
    const table = useReactTable({
        data,
        columns,
        state: {
            columnVisibility,
        },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div>
            <div className="inline-block border border-black shadow rounded">
                <div className="px-1 border-b border-black">
                    <label>
                        <input
                            {...{
                                type: 'checkbox',
                                checked: table.getIsAllColumnsVisible(),
                                onChange: table.getToggleAllColumnsVisibilityHandler(),
                            }}
                        />{' '}
                        Toggle All
                    </label>
                </div>
                {table.getAllLeafColumns().map(column => {
                    return (
                        <div key={column.id} className="px-1">
                            <label>
                                <input
                                    {...{
                                        type: 'checkbox',
                                        checked: column.getIsVisible(),
                                        onChange: column.getToggleVisibilityHandler(),
                                    }}
                                />{' '}
                                {column.id}
                            </label>
                        </div>
                    )
                })}
            </div>
            <table id="jendeley_main_table">
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

export default App;
