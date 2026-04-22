import {pgTable, integer, varchar, timestamp} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";

const timeStamps ={
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt:timestamp('updated_at').defaultNow().notNull()
}

//table 1 for departments
export const departments = pgTable('departments',{
    id:integer('id').primaryKey().unique().notNull(),
    name:varchar('name',{length:255}).notNull(),
    description:varchar('description',{length:255}),
    code:varchar('code',{length:55}).notNull().unique(),
    ...timeStamps
})

//table 2 for subjects
export const subjects = pgTable('subjects',{
    id:integer('id').primaryKey().generatedByDefaultAsIdentity(),
    departmentId:integer('department_id').notNull().references(()=>departments.id,{onDelete:'restrict'}),
    //reference is used to point out that we are using the another table primary key as foreign key on another table to connect the two tables,
    //and we are restricting on delete
    name:varchar('name',{length:255}).notNull(),
    description:varchar('description',{length:255}),
    code:varchar('code',{length:55}).notNull().unique(),
    ...timeStamps
})

//creating relation between departments and subjects
//relation is used to create relation
export const departmentRelation = relations(departments,({many})=>({subjects:many(subjects)}))

//relation between subjects and departments
export const subjectRelation = relations(subjects,({one, many})=>({departments:one(departments,
        {
            fields:[subjects.departmentId],
            references:[departments.id]
        })}))

export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert

export type Subject = typeof subjects.$inferSelect
export type NewSubject = typeof subjects.$inferInsert