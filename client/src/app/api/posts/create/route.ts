import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    // Get the authorization token from the request headers
    const authorization = request.headers.get('authorization');
    
    // Create a new FormData for the backend request
    const backendFormData = new FormData();
    
    // Copy all files with the correct field name expected by backend
    const files = formData.getAll('files');
    files.forEach((file) => {
      if (file instanceof File) {
        backendFormData.append('media', file);
      }
    });
    
    // Copy other fields
    const caption = formData.get('caption');
    const type = formData.get('type');
    
    if (caption) backendFormData.append('caption', caption as string);
    if (type) backendFormData.append('type', type as string);
    
    console.log('Forwarding request to:', `${backendUrl}/posts`);
    console.log('Files count:', files.length);
    console.log('Authorization header:', authorization ? 'Present' : 'Missing');
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/posts`, {
      method: 'POST',
      body: backendFormData,
      headers: {
        ...(authorization && { 'Authorization': authorization }),
      },
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('Backend error response:', error);
      return NextResponse.json(
        { error: 'Failed to create post', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}