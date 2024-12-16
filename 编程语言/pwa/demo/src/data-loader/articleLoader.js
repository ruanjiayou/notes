import { createItemsLoader } from './baseLoader';
import Article from '../models/article';
import services from '../services/index';

export default createItemsLoader(Article, async (params) => {
    return services.getArticles(params);
})