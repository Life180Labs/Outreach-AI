import { NextResponse } from "next/server";

export const successResponse = (
    data: unknown = null,
    message = "Success",
    status = 200
) => {
    return NextResponse.json(
        {
            success: true,
            message,
            data,
        },
        { status }
    );
};

export const errorResponse = (
    error = "Something went wrong",
    status = 500,
    details?: unknown
) => {
    return NextResponse.json(
        {
            success: false,
            error,
            details,
        },
        { status }
    );
};