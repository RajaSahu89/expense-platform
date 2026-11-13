import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * Turns any thrown error into a clean JSON response instead of an opaque
 * 500 HTML page. Prisma's most common error codes are mapped to the HTTP
 * status a client would expect.
 */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      case 'P2002':
        return NextResponse.json({ error: 'A record with these values already exists' }, { status: 409 });
      case 'P2003':
        return NextResponse.json({ error: 'Referenced record does not exist' }, { status: 400 });
    }
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: 'Something went wrong on the server' }, { status: 500 });
}

/** Wraps a route handler so every failure goes through `handleError`. */
export function route<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
