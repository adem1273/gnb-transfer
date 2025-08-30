import React from 'react';

function UserTable({ users }) {
    return (
        <table className="w-full border">
            <thead>
                <tr className="bg-gray-700 text-white">
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Role</th>
                </tr>
            </thead>
            <tbody>
                {users.map(u => (
                    <tr key={u._id} className="border-b">
                        <td className="p-2">{u.name}</td>
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.role}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default UserTable;
