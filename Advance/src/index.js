// require('dotenv').config({path: '/.env'})
import dotenv from 'dotenv'


import {DB_NAME} from './constants.js';
import connectDB from './db/index.js'

dotenv.config({
    path: '/.env'
})

connectDB()
.then((result) => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Listening to port ${process.env.PORT}`);
    })
})
.catch((err) => {
    
});