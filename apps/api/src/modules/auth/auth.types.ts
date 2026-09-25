export type AuthRole = {
  name: string;
  permissions: string[];
};

export type AuthUser = {
  id: string;
  companyId: string | null;
  email: string;
  name: string;
  title: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
  } | null;
  roles: AuthRole[];
};

export type JwtPayload = {
  sub: string;
  companyId: string | null;
  email: string;
  roles: string[];
};

export type AuthenticatedRequest = Request & {
  user: JwtPayload;
};
