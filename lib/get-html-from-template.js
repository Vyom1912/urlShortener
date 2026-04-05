import fs from 'fs/promises';
import path from 'path';
import ejs from 'ejs';
import mjml2html from 'mjml';

export const getHtmlFromMjmlTemplate = async (template, data) => {
  // 1. wee need to reasd the template file
  const mjmlTemplate = await fs.readFile(
    path.join(import.meta.dirname, '..', 'emails', `${template}.mjml`),
    'utf-8',
  );
  // 2. we need to replace the placeholders in the template with the actual data
  const filledTemplate = ejs.render(mjmlTemplate, data);

  // 3. we need to convert the filled template to HTML
  //   const { html } = mjml2html(filledTemplate);
  return mjml2html(filledTemplate).html;
  // const compiledTemplate = handlebars.compile(mjmlTemplate);
  // const mjmlWithData = compiledTemplate(data);
};
