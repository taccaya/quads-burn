export type ExampleEntity = {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'ready' | 'archived';
};
