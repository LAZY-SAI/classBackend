import express from 'express'
// Import Drizzle ORM utility functions for building queries
// and, or: Logical operators to combine conditions
// desc: Sorts results in descending order
// eq: Checks for equality between a column and a value/another column
// getTableColumns: Helper to retrieve all column definitions from a table schema
// ilike: Case-insensitive pattern matching (SQL ILIKE)
// sql: Template literal tag for writing raw SQL fragments safely
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
// Import table schemas for departments and subjects
import {departments, subjects} from "../db/schema";
// Import the database connection instance
import {db} from '../db'

// Initialize the Express router
const router = express.Router()

// GET /subjects - Retrieve all subjects with optional search, filtering, and pagination
router.get('/', async (req, res) => {
    try {
        // Destructure query parameters with default values for pagination
        const {search, department, page = 1, limit = 10} = req.query
        // Ensure page and limit are at least 1 and convert to numbers
        const currentPage = Math.max(1, +page)
        const limitPerPage = Math.max(1, +limit)

        // Calculate the number of records to skip based on current page and limit
        const offSet = (currentPage - 1) * limitPerPage

        // Array to store filter conditions dynamically
        const filterCondition = []

        // If 'search' query exists, add a condition to match subject name OR subject code (case-insensitive)
        if (search) {
            filterCondition.push(
                or(
                    ilike(subjects.name, `%${search}%`), // Matches name containing the search string
                    ilike(subjects.code, `%${search}%`)  // Matches code containing the search string
                )
            )
        }

        // If 'department' filter exists, add a condition to match the department name exactly (case-insensitive)
        if (department) {
            filterCondition.push(
                ilike(departments.name, `${department}`)
            )
        }

        // Combine all filter conditions using the 'and' operator if any exist
        const whereClause = filterCondition.length > 0 ? and(...filterCondition) : undefined;

        // Query the database to get the total count of subjects matching the filters
        // sql<number>`count(*)`: Uses a raw SQL fragment to perform a count operation
        const countResult = await db.select({count: sql<number>`count(*)`})
            .from(subjects)
            // Join with departments table to enable filtering by department name
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        // Extract the count from the result array, defaulting to 0
        const totalCount = countResult[0]?.count || 0

        // Query the database to retrieve the list of subjects with pagination and sorting
        // getTableColumns(subjects): Automatically selects all columns from the subjects table
        // department: { ... }: Groups joined department columns into a nested 'department' object
        const subjectsList = await db.select({
            ...getTableColumns(subjects),
            department: {...getTableColumns(departments)}
        })
            .from(subjects)
            // Join with departments table using subject's departmentId
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            // Sort by creation date in descending order (newest first)
            .orderBy(desc(subjects.createdAt))
            // Limit the number of results returned
            .limit(limitPerPage)
            // Skip the appropriate number of results for pagination
            .offset(offSet)

        // Send a 200 OK response with the data and pagination metadata
        res.status(200).json({
            data: subjectsList,
            page: currentPage,
            limit: limitPerPage,
            total: totalCount,
            totalPage: Math.ceil(totalCount / limitPerPage) // Calculate total pages available
        })
    } catch (e) {
        // Log the error for debugging
        console.error(`GET /subjects error:${e}`)
        // Send a 500 Internal Server Error response
        res.status(500).json({error: 'failed to get subjects'})
    }
})

export default router