import React from 'react';
import { Helmet } from 'react-helmet';
import BlogList from '../components/BlogList';

function Blog() {
    return (
        <div className="p-4">
            <Helmet>
                <title>GNB Transfer Blog | Latest News & Travel Guides</title>
                <meta name="description" content="Explore our latest blog posts about tours, transfers, and travel tips." />
            </Helmet>
            
            <h1 className="text-3xl font-bold mb-6 text-center">Our Blog</h1>
            
            <BlogList />
        </div>
    );
}

export default Blog;