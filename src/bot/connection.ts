import mongoose from 'mongoose';
import config from './config.js'

class DbConnections {
    // db = mysql.createPool({ ...config.dataBase })

    mongo = async () => {
        try {
            const options = {
                // autoIndex: false, // Don't build indexes
                // maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                // connectTimeoutMS: 10000
                // family: 4 // Use IPv4, skip trying IPv6
            };
            // let uri = config.environment === "development" ? config.mongodbdev :config.mongodb
            // let uri = "mongodb://mongo:27017/whats"
            let uri =  config.mongodbdev
            mongoose.set('strictQuery', true)
      
            // mongoose.connect(`${config.mongodb}`, options);
            const connection = mongoose.connection;    
            // const AutoIncrement = AutoIncrementFactory(connection);

            connection.once("open", function () {
                console.log("[MongoDB] connection established successfully");
            });
return       mongoose.connect(`${uri}`, options);
        } catch (error:any) {
            console.log({ mongoerrconnection: error.message })
        }
    }
    constructor() {
        // this.mongo()
    }
}



export default new DbConnections()