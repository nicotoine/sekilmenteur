const readHash = () => location.hash.replace(/^#\/?/, '');

class Router {
  current = $state(readHash());

  constructor() {
    addEventListener('hashchange', () => {
      this.current = readHash();
    });
  }

  go(id) {
    location.hash = id ? `/${id}` : '';
  }
}

export const router = new Router();
