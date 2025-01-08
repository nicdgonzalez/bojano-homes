import { MetaProvider, Title } from "@solidjs/meta";

export default function Page() {
  return (
    <>
      <MetaProvider>
        <Title>Not Found | Bojano Homes</Title>
      </MetaProvider>
      <h1>404: Not Found</h1>
    </>
  );
}
