import express, { Request, Response } from 'express';
import subjectRouter from './routes/subjects'
import cors from 'cors'
const app = express();
const port = 8000;
app.use(cors({
  origin:process.env.FRONTEND_URI,
  methods:['GET','POST','PUT','DELETE'],
  credentials:true
}))
app.use(express.json());

app.use('/api/subjects',subjectRouter)
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from the Express server!' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
