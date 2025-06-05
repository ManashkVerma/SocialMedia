// require('dotenv').config({path: '/.env'})
import dotenv from 'dotenv'
import connectDB from './db/index.js'
import {app} from '../src/app.js'
dotenv.config({
    path: '/.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Listening to port ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});