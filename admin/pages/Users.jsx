import React, { useEffect, useState } from 'react';
import UserTable from '../components/UserTable';
import axios from 'axios';

function Users() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        axios.get('/admin/users', {
            headers: { Authorization: 'Bearer mysecrettoken' }
        })
        .then(res => setUsers(res.data))
        .catch(err => console.error(err));
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Users</h1>
            <UserTable users={users} />
        </div>
    );
}

export default Users;
