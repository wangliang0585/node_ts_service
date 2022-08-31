import express from 'express';
import controller from '../controllers/test';
const router = express.Router();
router.post('/create', controller.createTable);
router.get('/get', controller.getTestModel);
router.post('/post/:aaa', controller.postTestModel);
export = router;