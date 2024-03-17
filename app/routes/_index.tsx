import { ActionFunctionArgs, json, LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { Form, isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react";
import { store } from "~/models/Store";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

type Row = { tiny: string, long: string, clickCount: number }

export const loader = async () => {
  let rows: Row[] = []
  store.tinyMap.forEach((long_value: string, tiny_key: string) => {
    let count = store.longMap.get(long_value)
    rows.push({
      tiny: tiny_key,
      long: long_value,
      clickCount: count
    })
  })
  return json({
    rows: rows,
    spotlight: store.spotlight == undefined ?
      undefined : store.getLongFromTiny(store.spotlight!, false),
    customTinyUrlError: store.customTinyUrlError
  });
};

enum FormNames {
  GENERATE_TINY_FORM = 'generate a tiny url',
  QUERY_TINY_FORM = 'query',
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const formName = formData.get('formName');
  switch (request.method) {
    case "POST": {
      switch (formName) {
        case FormNames.GENERATE_TINY_FORM:
          // generate a random or custom tiny from long
          const long_url = formData.get('long_url')!.toString();
          if (!long_url)
            return null;
          const custom_tiny_url = formData.get('custom_tiny_url')?.toString();
          let tiny = store.generateTinyFromLong(long_url, custom_tiny_url);
          if (tiny === "DUPLICATE!") {
            store.customTinyUrlError = "duplicate custom tiny url, retry."
          } else {
            store.customTinyUrlError = null
          }
          break;
        case FormNames.QUERY_TINY_FORM:
          // query long url and click count using a tiny url.
          store.spotlight = formData.get('tiny_url_query')!.toString();
          store.getLongFromTiny(store.spotlight!, true);
          break;
        default:
          throw new Error("illegal input")
      }
      break;
    }
    case "DELETE": {
      // delete a tiny
      const tiny_url = formData.get('tiny_url_delete')!.toString();
      store.deleteTiny(tiny_url)
      break;
    };
    default:
      throw new Error("illegal input")
  }

  return null;
};


export default function Index() {
  let { rows, spotlight, customTinyUrlError } = useLoaderData<typeof loader>()

  return (
    <>
      <div style={{ backgroundColor: "pink", margin: "10px", padding: "10px" }}>
        <table>
          <thead>
            <tr>
              <th>
                tiny
              </th>
              <th>
                long
              </th>
              <th>
                clickCount
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr>
                <td>{row.tiny}</td>
                <td>{row.long}</td>
                <td>{row.clickCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ backgroundColor: "yellow", margin: "10px", padding: "10px" }}>
        <Form method='post'>
          <div >
            <div>
              Long url:
              <input
                placeholder="https://mylongurl.com"
                name='long_url'
                type="text"
              />
            </div>
            <div>
              Custom tiny url (randomly generated if not specified):
              <input
                placeholder="31AE"
                name='custom_tiny_url'
                type="text"
              />
            </div>
            <button name='formName' value={FormNames.GENERATE_TINY_FORM}>create tiny url</button>
            <div>
              {customTinyUrlError == null ? "" : `custom tiny url is duplicate`}
            </div>
          </div>
        </Form>
      </div>

      <div style={{ backgroundColor: "gray", margin: "10px", padding: "10px" }}>
        <Form method='delete'>
          <div>
            Tiny url:
            <input
              placeholder="31AE"
              name='tiny_url_delete'
              type="text"
            />
            <button>delete</button>
          </div>
        </Form>
      </div >

      <div style={{ backgroundColor: "green", margin: "10px", padding: "10px" }}>
        <Form method='post' >
          <div>
            Tiny url:
            <input
              placeholder="31AE"
              name='tiny_url_query'
              type="text"
            />
            <button name='formName' value={FormNames.QUERY_TINY_FORM}>query tiny url</button>
            <div>
              {spotlight === undefined ? "" :
                spotlight == null ?
                  "not found" : `spotlight: ${spotlight.longUrl}, clickcount: ${spotlight.clickCount}`}
            </div>
          </div>
        </Form>
      </div >
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}