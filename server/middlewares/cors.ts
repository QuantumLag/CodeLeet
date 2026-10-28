import { NextFunction } from "express";
import express from "express";

export function customCors(
    req: express.Request,
    res: express.Response,
    next: NextFunction
) {
    const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    const requestOrigin = req.headers.origin;

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        res.setHeader("Access-Control-Allow-Origin", requestOrigin);
        res.setHeader("Vary", "Origin");
    }
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, content-type, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, OPTIONS, DELETE"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).json({
            body: "OK",
        });
    }
    next();
}
