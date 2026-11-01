import aiService from "../services/ai.service.js";

class AiController {
  async analyze(req, res, next) {
    try {
      const analysis = await aiService.analyze(req.body.message);
      return res.json({
        success: true,
        data: {
          message: req.body.message,
          analysis,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async retrieve(req, res, next) {
    try {
      const data = await aiService.retrieve(req.body.message);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async searchKnowledge(req, res, next) {
    try {
      const data = await aiService.searchKnowledge(req.body);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async chat(req, res, next) {
    try {
      const data = await aiService.chat(req.body.message);
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }
}

export default new AiController();
