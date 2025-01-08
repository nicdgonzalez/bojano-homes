import { Navigate, useParams } from "@solidjs/router";

export default function Page() {
  const params = useParams();

  // TODO: return NotFound if not a valid index.

  return <Navigate href={`/properties/${params.index}/summary`} />;
}
