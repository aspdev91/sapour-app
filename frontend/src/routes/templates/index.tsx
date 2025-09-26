import { Routes, Route } from 'react-router-dom';
import TemplatesList from './TemplatesList';
import TemplateEditor from './TemplateEditor';
import TemplateVersions from './TemplateVersions';

export default function TemplatesRoutes() {
  return (
    <Routes>
      <Route index element={<TemplatesList />} />
      <Route path="new" element={<TemplateEditor />} />
      <Route path=":templateId" element={<TemplateEditor />} />
      <Route path=":templateId/versions" element={<TemplateVersions />} />
    </Routes>
  );
}
