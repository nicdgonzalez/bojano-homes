import { MetaProvider, Title } from "@solidjs/meta";

export default function Page() {
  return (
    <>
      <MetaProvider>
        <Title>Summary | Bojano Homes</Title>
      </MetaProvider>
    </>
  );
}
