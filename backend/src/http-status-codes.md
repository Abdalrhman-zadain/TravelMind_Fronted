# HTTP Status Codes Quick Guide

This file explains the most common HTTP status codes you will see while working on the TravelMind backend and frontend.

## Success Codes

### `200 OK`

- The request worked successfully.
- The server returned the requested data or page.

Example:

- Loading an API endpoint and receiving JSON data.

### `201 Created`

- A new resource was created successfully.
- Usually returned after a `POST` request.

Example:

- Creating a new user, booking, or review.

### `204 No Content`

- The request worked, but the server returned no response body.

Example:

- Deleting or updating something when no extra data is needed in the response.

## Cache / Browser Codes

### `304 Not Modified`

- The browser already has a cached copy.
- The server is telling the browser to reuse the cached file because it has not changed.

Example:

- JavaScript, CSS, images, or cached API responses.

Important:

- `304` is usually normal.
- It is not an error.
- If you changed code but still see old behavior, do a hard refresh.

## Client Error Codes

### `400 Bad Request`

- The request was invalid.
- This usually means missing fields, bad JSON, or invalid parameters.

### `401 Unauthorized`

- The user is not logged in, or the token is missing or invalid.

### `403 Forbidden`

- The user is logged in, but does not have permission to access the resource.

Example:

- A normal user trying to access an admin-only route.

### `404 Not Found`

- The route or requested resource does not exist.

Example:

- Wrong API URL.
- Record not found by ID.

### `409 Conflict`

- The request conflicts with existing data.

Example:

- Trying to create an account with an email that already exists.

### `422 Unprocessable Entity`

- The request format is correct, but validation failed.

Example:

- Invalid email format.
- Weak password.
- Invalid field value.

## Server Error Codes

### `500 Internal Server Error`

- Something broke on the server.
- This is usually caused by backend bugs, database problems, or unhandled exceptions.

### `502 Bad Gateway`

- One server received a bad response from another service.

### `503 Service Unavailable`

- The server is temporarily unavailable.
- This can happen during downtime, maintenance, or overload.

## Simple Rule

- `2xx` = success
- `3xx` = redirect or cache-related
- `4xx` = problem in the request or user access
- `5xx` = problem on the server

## TravelMind Debugging Tips

- `200` or `201` usually means the API is working correctly.
- `304` usually means the browser is using a cached file.
- `401` or `403` usually means an authentication or permissions problem.
- `404` usually means the route is wrong or the item does not exist.
- `500` usually means a backend or database issue.
