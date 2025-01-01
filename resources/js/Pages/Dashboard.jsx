import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from "axios";
import { useState, useEffect } from 'react';


export default function Dashboard() {

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        axios.get('https://dummyjson.com/posts')
            .then(response => {
                setPosts(response.data.posts);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">

                            <img
                                src="/images/dashboard.png"
                                alt="Dashboard Logo"
                                className="mx-auto mb-4 w-full"
                            />
                            {/*You're logged in!****/}
                            {/*<h2 className="text-lg font-bold mb-4">Posts:</h2>*/}
                            {/*<ul>*/}
                            {/*    {posts.map(post => (*/}
                            {/*        <li key={post.id}>*/}
                            {/*            <h3 className="text-md font-bold">{post.title}</h3>*/}
                            {/*            <p>{post.content}</p>*/}
                            {/*        </li>*/}
                            {/*    ))}*/}
                            {/*</ul>*/}

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
