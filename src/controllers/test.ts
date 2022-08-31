import e, { Request, Response, NextFunction, query } from 'express';
import { getRedisClient, getDbMasterClient, getDbSalveClient, createMasterTable } from '../server';

interface TestModel {
    id: number;
    name: string;
}
interface ReqQuery {
    aaa: string;
}

const getTestModel = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.query.aaa as string;
    const name = await getRedisClient().get(id ?? "0");
    let message = "no exist";
    if (name) {
        console.log("cached in redis");
        message = name;
    } else {
        getDbSalveClient().query(`SELECT name FROM test where id=${id}`, async (err: any, results: Array<string>) => {
            if (err) {
                console.log("MySql SELECT hanppend error: ", err);
            } else {
                if(results.length > 0) {
                    console.log("cached in db");
                    message = results[0];
                } else {
                    //insert to db
                    message = `hello ${id}`;
                    getDbMasterClient().query(`INSERT INTO test (id, name) VALUES (${id}, '${message}')`, (err: any, results: Array<string>) => {
                        if (err) {
                            console.log("MySql INSERT hanppend error: ", err);
                        } else {
                            console.log("MySql INSERT success");
                        }
                    })
                }
                await getRedisClient().set(id, message, {'EX': 10});
            }
        });
    }

    return res.status(200).json({
        message: message
    });
}

const postTestModel = async (req: Request, res: Response, next: NextFunction) => {
    const id: string = req.params.aaa;
    console.log("=======",id);
    let model : TestModel = {
        id: Number.parseInt(id),
        name: req.body.imagedata
    };
    return res.status(200).json({
        message: model
    });
}

const createTable = async (req: Request, res: Response, next: NextFunction) => {
    console.log("create table");
    createMasterTable();
    return res.status(200).json({
        message: "success"
    });
};
export default { getTestModel, postTestModel, createTable };