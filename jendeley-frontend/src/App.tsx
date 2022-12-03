import React, {useMemo} from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ReactDOM from 'react-dom/client'
import base_64 from 'base-64'
import './App.css';
import {Entry, DB} from './schema';
import MaterialReactTable, {MRT_ColumnDef} from 'material-react-table';

function authorChips(authors: string[]) {
    return (
        <Stack direction="row" spacing={1}>
            {authors.map((a) =>
                <Chip label={`${a}`} />
            )}
        </Stack>
    )
}

function tagChips(tags: string[]) {
    return (
        <Stack direction="row" spacing={1}>
            {tags.map((a) =>
                <Chip label={`${a}`} />
            )}
        </Stack>
    )
}

function App() {
    const [data, setData] = React.useState<DB>([])

    React.useEffect(() => {
        console.log("Fetching from DB");
        fetch("http://localhost:5000/api/get_db")
            .then(response => response.json())
            .then(json => setData(() => json));
    }, []);

    const columns = useMemo<MRT_ColumnDef<Entry>[]>(
        () => [
            {
                accessorKey: 'id',
                header: 'id',
            },
            {
                accessorKey: 'title',
                Cell: ({cell, row}) => (<a href={`${"http://localhost:5000/api/get_pdf/?file=" + base_64.encode(escape(row.original.path))}`}>{`${cell.getValue()}`}</a>),
                header: 'title',
            },
            {
                accessorKey: 'path',
                header: 'path',
            },
            {
                accessorKey: 'authors',
                Cell: ({cell}) => (authorChips(cell.getValue<string[]>())),
                header: 'authors',
            },
            {
                accessorKey: 'tags',
                Cell: ({cell}) => (tagChips(cell.getValue<string[]>())),
                header: 'tags',
            },
            {
                accessorKey: 'comments',
                header: 'comments',
            },
            {
                accessorKey: 'year',
                header: 'year',
            },
            {
                accessorKey: 'publisher',
                header: 'publisher',
            },
        ],
        [],
    );

    return <MaterialReactTable
        columns={columns}
        data={data}
        enablePagination={false}
        initialState={{
            showColumnFilters: true,
            sorting: [{id: 'year', desc: true}],
            showGlobalFilter: true,
            columnVisibility: {id: false, path: false},
        }}
        positionGlobalFilter="left"
        enableStickyHeader
        globalFilterFn="contains"
        enableColumnResizing
        columnResizeMode="onChange"
    />;
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

export default App;
