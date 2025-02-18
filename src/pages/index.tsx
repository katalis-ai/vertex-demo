import { ChangeEvent, FormEvent, useState } from "react";
import Image from "next/image";
import { listTemplate } from "@/helper";

interface Template {
  id: number;
  detail: string;
  category_name: string;
  name: string;
}

interface Prediction {
  bytesBase64Encoded: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<Prediction[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(
          reader.result
            ? reader.result.toString().replace("data:", "").replace(/^.+,/, "")
            : ""
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePromptChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPrompt(event.target.value);
  };

  const handlePromptSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    setPrompt(event.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = {
      instances: [
        {
          prompt: prompt,
          image: {
            bytesBase64Encoded: imageBase64,
          },
        },
      ],
      parameters: {
        editConfig: {
          editMode: "product-image",
        },
      },
    };
    setIsLoading(true);
    fetch(
      "https://asia-northeast3-aiplatform.googleapis.com/v1/projects/fluid-stratum-417208/locations/asia-northeast3/publishers/google/models/imagegeneration@006:predict",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
      .then(async (resp) => {
        const json = await resp.json();
        console.log(json);
        if (json.error) {
          alert(json.error.message);
        } else {
          setResponse(json.predictions as Prediction[]);
        }
      })
      .catch((e) => console.log(e))
      .finally(() => setIsLoading(false));
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="flex flex-col gap-1">
        <label>Upload Image</label>
        <input type="file" onChange={handleImageChange} accept="image/*" />
        <label htmlFor="prompt-select">Choose a Template : </label>
        <select
          id="prompt-select"
          onChange={handlePromptSelect}
          className="mb-2 text-black"
        >
          <option value="">Select a prompt</option>
          {listTemplate.map((p: Template) => (
            <option key={p.id} value={p.detail}>
              {p.category_name} {p.name}
            </option>
          ))}
        </select>
        <label>Input Form</label>
        <input
          type="text"
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Enter prompt"
          className="text-black"
        />
        <button
          className="bg-blue-700 py-2 px-4 rounded-lg mt-3"
          onClick={handleSubmit}
        >
          {isLoading ? "Loading..." : "Submit"}
        </button>
      </div>
      <div className="flex flex-row flex-wrap justify-center items-center mt-4 gap-2">
        {Array.isArray(response) ? (
          response.length !== 0 &&
          response.map((item: Prediction, index: number) => (
            <Image
              key={index}
              src={`data:image/png;base64,${item.bytesBase64Encoded}`}
              alt="Generated Image"
              width={250}
              height={250}
            />
          ))
        ) : (
          <p>{response}</p>
        )}
      </div>
    </main>
  );
}
