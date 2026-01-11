import { Link } from 'react-router-dom';

export default function Account() {
  return (
    <div className={'text-center'}>
      <div className={'mt-2'}>
        <Link to={'/settings'} className={'text-sm text-muted-foreground underline'}>Configurações</Link>
      </div>
    </div>
  );
}
