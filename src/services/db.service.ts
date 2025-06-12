import db from "../database/databaseConnection"

export const initDatabase = ()=>{
    try {
        db.connectDB().then(r => {
            console.log('Base de datos conectada');
        });
    }catch (error) {
        throw error;
    }
}