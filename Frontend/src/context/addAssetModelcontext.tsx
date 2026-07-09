import { createContext, useContext, useState, type ReactNode } from "react";
import type { Asset } from "../types/asset";

type Step = "account" | "createAccount" | "asset" | "details";

interface OpenOptions {
  accountId?: string;
  asset?: Asset;
}


interface AddAssetModalState {
  isOpen: boolean;
  step: Step;
  selectedAccountId: string | null;
  selectedAsset: Asset | null;
}

interface AddAssetModalContextValue extends AddAssetModalState {
  openAddAssetModal: (options?: OpenOptions) => void;
  closeModal: () => void;
  goToStep: (step: Step) => void;
  setSelectedAccountId: (id: string) => void;
  setSelectedAsset: (asset: Asset) => void;
}

const AddAssetModalContext = createContext<AddAssetModalContextValue | null>(
  null
);

const initialState: AddAssetModalState = {
  isOpen: false,
  step: "account",
  selectedAccountId: null,
  selectedAsset: null,
};
export function AddAssetModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AddAssetModalState>(initialState);

  function openAddAssetModal(options?: OpenOptions) {
    const accountId = options?.accountId ?? null;
    const asset = options?.asset ?? null;

    let startStep: Step = "account";
    if (accountId && asset) startStep = "details";
    else if (accountId) startStep = "asset";
    else if (asset) startStep = "account";

    setState({
      isOpen: true,
      step: startStep,
      selectedAccountId: accountId,
      selectedAsset: asset,
    });
  }

  function closeModal() {
    setState(initialState);
  }

  function goToStep(step: Step) {
    setState((prev) => ({ ...prev, step }));
  }

  function setSelectedAccountId(id: string) {
    setState((prev) => ({ ...prev, selectedAccountId: id }));
  }

  function setSelectedAsset(asset: Asset) {
    setState((prev) => ({ ...prev, selectedAsset: asset }));
  }

  return (
    <AddAssetModalContext.Provider
      value={{
        ...state,
        openAddAssetModal,
        closeModal,
        goToStep,
        setSelectedAccountId,
        setSelectedAsset,
      }}
    >
      {children}
    </AddAssetModalContext.Provider>
  );
}

export function useAddAssetModal() {
  const context = useContext(AddAssetModalContext);
  if (!context) {
    throw new Error(
      "useAddAssetModal must be used within AddAssetModalProvider"
    );
  }
  return context;
}